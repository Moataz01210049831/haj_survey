import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE, AUTH_TOKEN } from './api-base';

export interface QuestionAnswer {
  QuestionId: string;
  AnswerValue: string;
}

export interface SurveyEntryPayload {
  FacilityId: string;
  ClassificationId: string;
  LanguageId: string;
  QuestionAnswers: QuestionAnswer[];
  Notes: string;
}

interface SurveyEntryResponse {
  Success: boolean;
  Message: string | null;
}

@Injectable({ providedIn: 'root' })
export class SurveyEntryService {
  private readonly http = inject(HttpClient);

  submit(payload: SurveyEntryPayload): Observable<SurveyEntryResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    });
    return this.http.post<SurveyEntryResponse>(`${API_BASE}/Entry/add`, payload, {
      headers,
    });
  }
}
