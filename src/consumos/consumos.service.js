// src/consumos/consumos.service.js
import * as consumosModel from "./consumos.model.js";
import * as reservasModel from "../reservas/reservas.model.js";

export const crearConsumo = async (data) => {
    const { reservaId, descripcion, monto } = data;

    // Validaciones
    if (!reservaId || !descripcion || !monto) {
        throw new Error("Todos los campos (reservaId, descripcion, monto) son obligatorios.");
    }

    // Validar que la reserva existe
    const reserva = await reservasModel.getReservaById(reservaId);
    if (!reserva) throw new Error("La reserva indicada no existe.");

    return await consumosModel.createConsumo(data);
};

export const obtenerConsumos = () => consumosModel.getAllConsumos();
export const obtenerConsumoPorId = (id) => consumosModel.getConsumoById(id);
export const actualizarConsumo = (id, data) => consumosModel.updateConsumo(id, data);
export const eliminarConsumo = (id) => consumosModel.deleteConsumo(id);
