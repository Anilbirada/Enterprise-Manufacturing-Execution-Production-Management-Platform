import { Machine } from '../models/Machine';
import { MachineState } from '../config/constants';

export interface IndustrialTelemetry {
  machineId: string;
  machineCode: string;
  state: MachineState;
  spindleSpeedRpm?: number;
  motorTemperatureCelsius?: number;
  vibrationMmPerSec?: number;
  cycleTimeActualSeconds?: number;
  pieceCountCurrentShift?: number;
  isSimulated: boolean;
  timestamp: Date;
}

export class IndustrialSimulationAdapter {
  private static simulationActive = false;
  private static intervalHandle: NodeJS.Timeout | null = null;
  private static subscribers: ((data: IndustrialTelemetry) => void)[] = [];

  public static onTelemetry(callback: (data: IndustrialTelemetry) => void) {
    this.subscribers.push(callback);
  }

  /**
   * Start read-only simulation loop
   * Note: NEVER sends control or safety-critical commands to physical PLCs
   */
  public static startSimulation(intervalMs: number = 5000) {
    if (this.simulationActive) return;
    this.simulationActive = true;

    this.intervalHandle = setInterval(async () => {
      try {
        const machines = await Machine.find({
          active: true,
          connectivityType: { $in: ['Simulated', 'OPC_UA', 'MQTT'] }
        }).limit(10);

        for (const machine of machines) {
          const isRunning = machine.state === MachineState.RUNNING;
          const telemetry: IndustrialTelemetry = {
            machineId: machine._id.toString(),
            machineCode: machine.code,
            state: machine.state,
            spindleSpeedRpm: isRunning ? Math.floor(1800 + (Math.random() * 200 - 100)) : 0,
            motorTemperatureCelsius: isRunning ? Math.round((52 + Math.random() * 8) * 10) / 10 : 31.5,
            vibrationMmPerSec: isRunning ? Math.round((1.2 + Math.random() * 0.6) * 100) / 100 : 0.05,
            cycleTimeActualSeconds: isRunning ? Math.round((machine.idealCycleTimeSeconds + (Math.random() * 4 - 2)) * 10) / 10 : 0,
            pieceCountCurrentShift: Math.floor(Math.random() * 50) + 10,
            isSimulated: true, // Strictly identified as simulation
            timestamp: new Date()
          };

          for (const sub of this.subscribers) {
            sub(telemetry);
          }
        }
      } catch (err) {
        console.error('[Simulation Adapter Error]', err);
      }
    }, intervalMs);
  }

  public static stopSimulation() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    this.simulationActive = false;
  }
}
