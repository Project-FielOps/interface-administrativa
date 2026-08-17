import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Page, PageQuery } from '../models/common.model';

/**
 * Thin base class for typed REST resources following the documented API
 * conventions: GET /{resource}?page&size&sort for paginated lists,
 * GET/POST/PUT /{resource}/{id} for single records.
 */
export abstract class CrudService<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  protected constructor(
    protected readonly http: HttpClient,
    protected readonly baseUrl: string,
  ) {}

  list(query: Record<string, unknown> = {}): Observable<Page<T>> {
    return this.http.get<Page<T>>(this.baseUrl, { params: toHttpParams(query) });
  }

  get(id: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${id}`);
  }

  create(payload: TCreate): Observable<T> {
    return this.http.post<T>(this.baseUrl, payload);
  }

  update(id: string, payload: TUpdate): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${id}`, payload);
  }
}

export function toHttpParams(query: Record<string, unknown> | PageQuery): HttpParams {
  let params = new HttpParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, String(value));
    }
  });
  return params;
}
