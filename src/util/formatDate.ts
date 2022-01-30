import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export const formatDate = (date: string) => format(
  new Date(date),
  "d MMM yyyy",
  {
    locale: ptBR,
  }
);

export const formatDateWithHours = (date: string) => format(
  new Date(date),
  "d MMM yyyy, 'às' H:m",
  {
    locale: ptBR,
  }
);
