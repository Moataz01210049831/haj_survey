import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

const API_BASE = 'https://portalrcmc.2p.com.sa/haj-surveys-api/api';

// TODO: replace with a proper auth flow once login is wired up.
const AUTH_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiJsaXNhIiwibmJmIjoxNzM5MDI4ODE2LCJleHAiOjE3Mzk2MzM2MTYsImlhdCI6MTczOTAyODgxNn0.sLQamqv3NCvDsEe4wfdjXzPlXC4QxrLYXJzTPcrjpeE';

interface LookupItemDto {
  Name: string;
  Value: string;
  Code: string;
  ID: string;
  ParentId: string;
  Order: number;
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
          }));
        }),
      );
  }
}
