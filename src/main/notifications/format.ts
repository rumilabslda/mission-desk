import type { Account } from '../../shared/types';
import { SERVICES } from '../accounts/services';

const MAX_SUBTITLE = 200;
const MAX_BODY = 500;

const text = (v: unknown, max: number): string => (typeof v === 'string' ? v.slice(0, max) : '');

export function formatNotification(
  account: Account,
  payload: { title: string; body?: string },
): { title: string; subtitle: string; body: string } {
  return {
    title: account.service === 'custom' ? account.name : `${account.name} · ${SERVICES[account.service].label}`,
    subtitle: text(payload.title, MAX_SUBTITLE),
    body: text(payload.body, MAX_BODY),
  };
}

export function shouldNotify(account: Account): boolean {
  return !account.muted;
}
