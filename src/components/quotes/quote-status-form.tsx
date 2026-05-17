import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { QUOTE_STATUSES, QUOTE_STATUS_LABELS } from '@/lib/quote-status';
import { updateQuoteStatusAction } from '@/server/actions/quotes.actions';

interface Props {
  quoteId: string;
  currentStatus: string;
}

export function QuoteStatusForm({ quoteId, currentStatus }: Props) {
  const action = updateQuoteStatusAction.bind(null, quoteId);

  return (
    <form action={action} className="flex items-center gap-2">
      <Select key={currentStatus} name="status" defaultValue={currentStatus} className="w-40">
        {QUOTE_STATUSES.map((status) => (
          <option key={status} value={status}>
            {QUOTE_STATUS_LABELS[status]}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="secondary" size="sm">
        Aggiorna
      </Button>
    </form>
  );
}
