import Singleton from "./singleton"

export default abstract class SocketManager extends Singleton {
	protected connections = new Map<string, SocketConnectionInfo>()

  protected abstract initializeListeners(): void;

  protected addConnection(id: string, info: SocketConnectionInfo): void {
  	this.connections.set(id, info)
  }

  protected removeConnection(id: string): void {
  	this.connections.delete(id)
  }

  protected handleDisconnection(id: string): void {
  	if (!this.connections.has(id)) return
  	this.connections.delete(id)
  	console.log(`Disconnected: ${id}`)
  }
}
