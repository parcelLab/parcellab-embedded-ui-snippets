export function isIpAddress(ip: string): boolean {
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return ip.split('.').every((part) => /^(0|[1-9]\d{0,2})$/.test(part) && Number(part) <= 255);
  }
  if (/^[\da-f:.]+$/i.test(ip) && ip.includes(':')) {
    try {
      new URL(`http://[${ip}]/`);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
