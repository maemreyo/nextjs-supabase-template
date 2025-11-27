import React from 'react';
import { createPortal } from 'react-dom';
import { useDialogStore } from '../../../../stores/analysis-dialog-store';
import { useOpenDialogs } from '../hooks/use-dialog-state';
import { DynamicAnalysisDialog } from './dynamic-analysis-dialog-renderer';
import { AnalysisType } from '../types/dialog-types';

/**
 * DialogRoot Renderer Component
 * 
 * Component này chịu trách nhiệm:
 * - Subscribe đến useDialogStore để lắng nghe thay đổi của openDialogs
 * - Render DynamicDialog cho mỗi dialog type đang mở
 * - Sử dụng Portal để render dialogs ra body
 * - Đảm bảo z-index đúng cho multiple dialogs
 */
export const DialogRootRenderer: React.FC = () => {
  const store = useDialogStore();
  const openDialogs = useOpenDialogs();

  // Lấy dialogData từ store để truyền vào DynamicDialog
  const dialogData = store.dialogData;

  console.log('🐛 DEBUG: DialogRootRenderer render', {
    openDialogs,
    dialogDataKeys: Object.keys(dialogData),
    totalOpenDialogs: openDialogs.length,
    timestamp: new Date().toISOString()
  });

  // Nếu không có dialog nào mở, không render gì
  if (openDialogs.length === 0) {
    console.log('🐛 DEBUG: No dialogs open, returning null');
    return null;
  }

  // Render dialogs với createPortal để đảm bảo chúng render ở top level
  // DialogPortal sẽ được sử dụng bên trong từng dialog component
  return createPortal(
    <div
      className="dialog-root-container fixed inset-0 pointer-events-none z-50"
      onMouseDown={(e) => {
        // Only handle clicks on the actual container, not on child elements
        if (e.target === e.currentTarget) {
          console.log('🐛 DEBUG: DialogRoot container clicked', {
            target: e.target,
            isRootContainer: e.target === e.currentTarget,
            targetElement: (e.target as HTMLElement).tagName,
            targetClass: (e.target as HTMLElement).className,
            timestamp: new Date().toISOString(),
            eventPhase: e.eventPhase,
            bubbles: e.bubbles,
            cancelable: e.cancelable
          });
        }
      }}
    >
      {openDialogs.map((type, index) => {
        console.log('🐛 DEBUG: Rendering dialog', {
          type,
          index,
          zIndex: 1000 + (index * 10),
          data: dialogData[type]
        });
        
        return (
          <DynamicAnalysisDialog
            key={type}
            type={type}
            data={dialogData[type]}
            zIndex={1000 + (index * 10)} // Tăng z-index cho mỗi dialog
          />
        );
      })}
    </div>,
    document.body
  );
};

export default DialogRootRenderer;