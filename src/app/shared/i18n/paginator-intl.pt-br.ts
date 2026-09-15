import { MatPaginatorIntl } from '@angular/material/paginator';

/**
 * Rótulos do paginador em pt-BR. O Material entrega os textos em inglês por
 * padrão ("Items per page", "1 – 4 of 4"), o que destoava do resto da interface.
 */
export function ptBrPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Itens por página:';
  intl.nextPageLabel = 'Próxima página';
  intl.previousPageLabel = 'Página anterior';
  intl.firstPageLabel = 'Primeira página';
  intl.lastPageLabel = 'Última página';
  intl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return `0 de ${length}`;
    }
    const total = Math.max(length, 0);
    const start = page * pageSize;
    const end = start < total ? Math.min(start + pageSize, total) : start + pageSize;
    return `${start + 1} – ${end} de ${total}`;
  };
  return intl;
}
