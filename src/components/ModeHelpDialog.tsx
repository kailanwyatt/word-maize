import { DialogCopy, FarmDialog } from './FarmDialog';
import { useMessages } from '../i18n';
import { useGameStore } from '../store/GameStore';
import type { ModeHelpId } from '../store/types';

export function ModeHelpDialog({
  mode,
  blocked = false,
}: {
  mode: ModeHelpId;
  blocked?: boolean;
}) {
  const t = useMessages();
  const store = useGameStore();
  const copy = t.modeHelp[mode];
  return (
    <FarmDialog
      visible={!blocked && !store.save.seenModeHelp[mode]}
      title={copy.title}
      primary={{ label: t.common.gotIt, onPress: () => store.markModeHelpSeen(mode) }}
    >
      {copy.lines.map(line => <DialogCopy key={line}>{line}</DialogCopy>)}
    </FarmDialog>
  );
}
