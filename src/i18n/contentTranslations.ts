import { api } from '../api/client';
import { getCurrentLanguage, type AppLanguage } from './config';

export type ContentTranslationMap = Partial<Record<AppLanguage, string>>;
export type ContentTranslationsByField = Record<string, ContentTranslationMap>;

export async function getContentTranslations(entityType: string, entityId: string) {
  const response = await api.get<{ translations: ContentTranslationsByField }>(
    `/api/v1/settings/content-translations/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`,
  );
  return response.data.translations ?? {};
}

export async function saveContentTranslations(
  entityType: string,
  entityId: string,
  field: string,
  translations: ContentTranslationMap,
) {
  const response = await api.put(
    `/api/v1/settings/content-translations/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/${encodeURIComponent(field)}`,
    { translations },
  );
  return response.data;
}

export function localizeContentValue(
  originalValue: string | null | undefined,
  translations: ContentTranslationsByField | null | undefined,
  field: string,
  language: AppLanguage = getCurrentLanguage(),
) {
  const fieldTranslations = translations?.[field];
  return fieldTranslations?.[language] ?? fieldTranslations?.en ?? originalValue ?? '';
}
