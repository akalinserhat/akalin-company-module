/**
 * @akalin/company_module - Firma Formu Otomatik Odaklanma Kancası (firmaFormAutoFocus.ts)
 */

import { useEffect, RefObject } from 'react';

export interface UseFirmaFormAutoFocusOptions {
  activeTabId?: string;
  isEditMode?: boolean;
  containerRef?: RefObject<HTMLElement | null>;
  dependencies?: any[];
}

export const useFirmaFormAutoFocus = (
  optionsOrActiveTab?: UseFirmaFormAutoFocusOptions | string,
  extraDeps: any[] = []
) => {
  const options: UseFirmaFormAutoFocusOptions =
    typeof optionsOrActiveTab === 'string'
      ? { activeTabId: optionsOrActiveTab, dependencies: extraDeps }
      : optionsOrActiveTab || {};

  const {
    activeTabId = 'genel',
    isEditMode = false,
    containerRef,
    dependencies = [],
  } = options;

  useEffect(() => {
    if (activeTabId && activeTabId !== 'genel') {
      return;
    }

    let interactionCancelled = false;
    const cancelOnInteraction = () => {
      interactionCancelled = true;
    };

    document.addEventListener('mousedown', cancelOnInteraction, { once: true, capture: true });
    document.addEventListener('keydown', cancelOnInteraction, { once: true, capture: true });
    document.addEventListener('touchstart', cancelOnInteraction, { once: true, capture: true });

    const timeout = setTimeout(() => {
      if (interactionCancelled) return;

      const rootNode = containerRef?.current || document;

      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && activeEl !== document.body && activeEl !== document.documentElement) {
        if (
          rootNode.contains(activeEl) &&
          (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA') &&
          activeEl.id !== 'firmaAdiInput' &&
          activeEl.getAttribute('name') !== 'firmaAdi'
        ) {
          return;
        }
      }

      let targetInput = rootNode.querySelector<HTMLInputElement>(
        '#firmaAdiInput, input[name="firmaAdi"]'
      );

      if (!targetInput) {
        targetInput = rootNode.querySelector<HTMLInputElement>(
          '.form-grid input:not([disabled]):not([type="hidden"]):not([readonly]), input:not([disabled]):not([type="hidden"]):not([readonly])'
        );
      }

      if (targetInput) {
        const style = window.getComputedStyle(targetInput);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          targetInput.focus({ preventScroll: false });

          if (isEditMode && typeof targetInput.setSelectionRange === 'function') {
            const valLen = targetInput.value ? targetInput.value.length : 0;
            targetInput.setSelectionRange(valLen, valLen);
          }
        }
      }
    }, 120);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', cancelOnInteraction, { capture: true });
      document.removeEventListener('keydown', cancelOnInteraction, { capture: true });
      document.removeEventListener('touchstart', cancelOnInteraction, { capture: true });
    };
  }, [activeTabId, isEditMode, ...(dependencies || [])]); // eslint-disable-line react-hooks/exhaustive-deps
};

export default useFirmaFormAutoFocus;
