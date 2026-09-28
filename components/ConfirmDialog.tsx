// components/ConfirmDialog.tsx
"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ConfirmDialogProps {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  abierto,
  titulo,
  descripcion,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  onConfirm,
  onCancel,
}) => {
  if (!abierto) return null;

  return (
    <div
      className="liquid-overlay fixed inset-0 z-2000 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="liquid-modal rounded-3xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="liquid-content p-8 space-y-5">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-white font-bold text-xl m-0">{titulo}</h2>
            <p className="text-gray-400 text-sm m-0">{descripcion}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-white/15 text-white hover:bg-white/10 rounded-xl h-11"
            >
              {textoCancelar}
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl h-11"
            >
              {textoConfirmar}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};