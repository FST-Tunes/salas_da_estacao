import { RoomManager } from "@/components/admin/RoomManager";
import { getRooms } from "@/lib/data/repository";

export const metadata = { title: "Salas" };

export default async function SalasPage() {
  const rooms = await getRooms(true);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-navy">Salas</h1>
        <p className="mt-1 text-sm text-text-muted">
          Adicione, renomeie ou remova salas. Remover preserva o histórico: a sala deixa de
          aceitar novas reservas mas as reservas passadas mantêm-se.
        </p>
      </div>
      <RoomManager rooms={rooms} />
    </div>
  );
}
