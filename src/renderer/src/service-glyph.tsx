import type { ServiceId } from '../../shared/types';
import { LOGOS } from './logos';

export const SERVICE_LABEL: Record<ServiceId, string> = {
  google: 'Google',
  slack: 'Slack',
  whatsapp: 'WhatsApp',
  microsoft: 'Microsoft 365',
  telegram: 'Telegram',
  linkedin: 'LinkedIn',
  discord: 'Discord',
  zoom: 'Zoom',
  proton: 'Proton Mail',
  icloud: 'iCloud Mail',
  fastmail: 'Fastmail',
  notion: 'Notion',
  custom: 'Any website',
};

export function ServiceLogo({ service, className }: { service: ServiceId; className?: string }): React.JSX.Element {
  return <img className={className} src={LOGOS[service]} alt="" draggable={false} />;
}
