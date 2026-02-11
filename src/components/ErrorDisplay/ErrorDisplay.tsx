import { useAppContext } from '../../store/AppContext';
import { useTranslation } from '../../i18n';
import './ErrorDisplay.css';

export function ErrorDisplay() {
  const { state, dispatch } = useAppContext();
  const { t } = useTranslation();

  if (!state.error) {
    return null;
  }

  const handleDismiss = () => {
    if (!state.error?.isFatal) {
      dispatch({ type: 'CLEAR_ERROR' });
    }
  };

  return (
    <div className={`error-area ${state.error.isFatal ? 'fatal' : ''}`}>
      <div className="error-icon">⚠️</div>
      <div className="error-message">{state.error.message}</div>
      {!state.error.isFatal && (
        <button className="error-dismiss" onClick={handleDismiss}>
          {t('error.dismiss')}
        </button>
      )}
    </div>
  );
}
