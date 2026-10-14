import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('country options', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('builds country names once per locale and keeps localized lists separate', async () => {
    const names = vi.spyOn(Intl.DisplayNames.prototype, 'of');
    const { getCountries } = await import('../src/countries');
    const english = getCountries('en');
    const calls = names.mock.calls.length;

    expect(getCountries('en')).toBe(english);
    expect(names).toHaveBeenCalledTimes(calls);
    const german = getCountries('de');
    expect(german).not.toBe(english);
    expect(english.find(({ code }) => code === 'DEU')?.name).toBe('Germany');
    expect(german.find(({ code }) => code === 'DEU')?.name).toBe('Deutschland');
    expect(getCountries('de')).toBe(german);
    expect(names).toHaveBeenCalledTimes(calls * 2);
  });

  it('keeps an unknown configured country out of other widgets', async () => {
    const { getCountries } = await import('../src/countries');
    const { resolveConfig } = await import('../src/config');
    const { linkViewModel } = await import('../src/model');
    const { WidgetRenderer } = await import('../src/render');
    const hosts = [document.createElement('div'), document.createElement('div')];
    document.body.append(...hosts);

    for (const [index, country] of ['ZZZ', 'DEU'].entries()) {
      const config = resolveConfig({ target: hosts[index]!, accountId: 18, destinationCountry: country, zipPicker: 'inline', countryPicker: true });
      const renderer = new WidgetRenderer(hosts[index]!);
      renderer.setCountryChangeHandler(vi.fn());
      renderer.render(config, linkViewModel(config));
    }

    expect(hosts[0]!.querySelector<HTMLSelectElement>('select')?.value).toBe('ZZZ');
    expect(hosts[1]!.querySelector('option[value="ZZZ"]')).toBeNull();
    expect(getCountries('en').some(({ code }) => code === 'ZZZ')).toBe(false);
  });
});
