import { format } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

export const formatDate = (date: string) => format(
  new Date(date),
  "d MMM yyyy",
  {
    locale: enUS,
  }
);

export const formatDateWithHours = (date: string) => format(
  new Date(date),
  "d MMM yyyy, H:m",
  {
    locale: enUS,
  }
);
