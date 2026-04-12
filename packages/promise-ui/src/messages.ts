import type { WidgetMessages } from './types';
import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import es from './locales/es.json';

const MESSAGE_MAP: Record<string, WidgetMessages> = { en, de, fr, it, es };

export function getMessages(locale: string): WidgetMessages {
  return MESSAGE_MAP[locale] ?? MESSAGE_MAP.en;
}
