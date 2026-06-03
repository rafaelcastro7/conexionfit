import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddClientDialog from './AddClientDialog';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('AddClientDialog – validación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function open() {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<AddClientDialog onAdd={onAdd} existingClients={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo cliente/i }));
    return { onAdd };
  }

  it('rechaza guardar sin nombre', async () => {
    const { onAdd } = open();
    fireEvent.click(await screen.findByRole('button', { name: /guardar cliente/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('El nombre es obligatorio'));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('guarda sin patología con nombre mínimo', async () => {
    const { onAdd } = open();
    fireEvent.change(await screen.findByPlaceholderText(/nombre del cliente/i), {
      target: { value: 'Juan Perez' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar cliente/i }));
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd.mock.calls[0][0]).toMatchObject({
      name: 'JUAN PEREZ',
      medicalNotes: null,
      program: null,
    });
  });
});
