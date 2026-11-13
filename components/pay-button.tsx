import { payCharge } from "@/app/portal/actions";
import { ActionForm, SubmitButton } from "@/components/form";

export function PayButton({ chargeId, label = "Pay now" }: { chargeId: string; label?: string }) {
  return (
    <ActionForm action={payCharge} className="actions">
      <input type="hidden" name="chargeId" value={chargeId} />
      <SubmitButton className="btn btn--sm" pendingLabel="Opening…">
        {label}
      </SubmitButton>
    </ActionForm>
  );
}
