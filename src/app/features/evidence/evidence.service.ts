import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Evidence } from '../../core/models/inspection.model';

/**
 * Evidence metadata and authorized content access, nested under an inspection.
 */
@Injectable({ providedIn: 'root' })
export class EvidenceService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  listByInspection(inspectionId: string): Observable<Evidence[]> {
    return this.http.get<Evidence[]>(`${this.baseUrl}/inspections/${inspectionId}/evidence`);
  }

  getById(inspectionId: string, evidenceId: string): Observable<Evidence> {
    return this.http.get<Evidence>(
      `${this.baseUrl}/inspections/${inspectionId}/evidence/${evidenceId}`,
    );
  }

  contentUrl(inspectionId: string, evidenceId: string): string {
    return `${this.baseUrl}/inspections/${inspectionId}/evidence/${evidenceId}/content`;
  }

  downloadContent(inspectionId: string, evidenceId: string): Observable<Blob> {
    return this.http.get(this.contentUrl(inspectionId, evidenceId), {
      responseType: 'blob',
    });
  }
}
