import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE, AUTH_TOKEN } from './api-base';

interface LookupItemDto {
  Name: string;
  Value: string;
  Code: string;
  ID: string;
  ParentId: string;
  Order: number;
  FacilityTypeId?: string;
}

interface LookupResponseDto {
  Success: boolean;
  Message: string | null;
  Data: LookupItemDto[] | null;
  TotalCount: number;
}

export interface LookupItem {
  id: string;
  code: string;
  name: string;
  order: number;
  facilityTypeId?: string;
}

@Injectable({ providedIn: 'root' })
export class LookupsService {
  private readonly http = inject(HttpClient);

  getLanguages(): Observable<LookupItem[]> {
    return this.fetch('language');
  }

  getClassifications(language: string): Observable<LookupItem[]> {
    return this.fetch('classification', { language });
  }

  getFacility(entityId: string, language: string): Observable<LookupItem | null> {
    return this.fetch('facility', { language, params: { entityId } }).pipe(
      map((items) => items[0] ?? null),
    );
  }

  getQuestions(
    classificationId: string,
    facilityTypeId: string,
    language: string,
  ): Observable<LookupItem[]> {
    return this.fetch('question', {
      language,
      params: { filter1: classificationId, filter2: facilityTypeId },
    });
  }

  private fetch(
    lookupId: string,
    options: { language?: string; params?: Record<string, string> } = {},
  ): Observable<LookupItem[]> {
    let headers = new HttpHeaders({ Authorization: `Bearer ${AUTH_TOKEN}` });
    if (options.language) headers = headers.set('Language', options.language);

    return this.http
      .get<LookupResponseDto>(`${API_BASE}/Lookups`, {
        params: { lookupId, ...(options.params ?? {}) },
        headers,
      })
      .pipe(
        map((res) => {
          if (!res.Success) {
            throw new Error(res.Message ?? 'Lookup request failed');
          }
          return (res.Data ?? []).map((item) => ({
            id: item.ID,
            code: item.Code,
            name: item.Name,
            order: item.Order,
            facilityTypeId: item.FacilityTypeId,
          }));
        }),
      );
  }
}
