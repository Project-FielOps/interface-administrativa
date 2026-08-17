import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Evidence } from '../../core/models/inspection.model';

/**
 * Evidence metadata only (spec MVP: no image byte-serving endpoint), nested under an
 * inspection: GET /inspections/{inspectionId}/evidence.
 */
@Injectable({ providedIn: 'root' })
export class EvidenceService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  listByInspection(inspectionId: string): Observable<Evidence[]> {
    return this.http.get<Evidence[]>(`${this.baseUrl}/inspections/${inspectionId}/evidence`);
  }
}
