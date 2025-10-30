import { Player } from "../shared/player";
import { Room } from "../shared/room";
import { Chat } from "../shared/chat";
import { State } from "../shared/state";
import { ChatMessage } from "../shared/chat";
import { Vec2 } from "../shared/v2";

// Deserialize array back to Map
export function deserializePlayerMap(data: unknown): Map<string, Player> {
   const map = new Map<string, Player>();

   if (Array.isArray(data)) {
      for (const playerData of data) {
         const player = new Player(
            playerData.id,
            playerData.team,
            new Vec2(playerData.pos.x, playerData.pos.y),
            playerData.name,
            playerData.ready
         );

         // Restore additional state
         player.moveVel = new Vec2(playerData.moveVel.x, playerData.moveVel.y);
         player.dashing = playerData.dashing;
         player.dashProgress = playerData.dashProgress;
         player.dashVel = new Vec2(playerData.dashVel.x, playerData.dashVel.y);
         player.health = playerData.health;
         player.maxHealth = playerData.maxHealth;

         map.set(player.id, player);
      }
   } else if (data && typeof data === "object") {
      for (const [id, playerData] of Object.entries(data)) {
         const pd = playerData as any;
         const player = new Player(pd.id, pd.team, new Vec2(pd.pos.x, pd.pos.y), pd.name, pd.ready);

         // Restore additional state
         player.moveVel = new Vec2(pd.moveVel.x, pd.moveVel.y);
         player.dashing = pd.dashing;
         player.dashProgress = pd.dashProgress;
         player.dashVel = new Vec2(pd.dashVel.x, pd.dashVel.y);
         player.health = pd.health;
         player.maxHealth = pd.maxHealth;

         map.set(id, player);
      }
   } else {
      console.warn("Unexpected player map data format:", typeof data);
   }

   return map;
}

// Helper function to create Player from data
function createPlayerFromData(playerData: any): Player {
   const player = new Player(
      playerData.id,
      playerData.team,
      new Vec2(playerData.pos.x, playerData.pos.y),
      playerData.name,
      playerData.ready
   );

   // Restore additional state
   player.moveVel = new Vec2(playerData.moveVel.x, playerData.moveVel.y);
   player.dashing = playerData.dashing;
   player.dashProgress = playerData.dashProgress;
   player.dashVel = new Vec2(playerData.dashVel.x, playerData.dashVel.y);
   player.health = playerData.health;
   player.maxHealth = playerData.maxHealth;

   return player;
}

// Deserialize Room from network data
export function deserializeRoom(data: any): Room {
   if (!data || typeof data !== "object") {
      throw new Error("Invalid room data");
   }

   const room = new Room(data.code);

   // Deserialize players
   if (data.players) {
      room.players = deserializePlayerMap(data.players);
   }

   // Set room state
   if (data.roomState !== undefined) {
      room.roomState = data.roomState;
   }

   // Deserialize game state
   if (data.gameState) {
      room.gameState = deserializeState(data.gameState);
   }

   // Deserialize chat
   if (data.chat) {
      room.chat = deserializeChat(data.chat);
   }

   return room;
}

// Deserialize State
export function deserializeState(data: any): State {
   if (!data || typeof data !== "object") {
      throw new Error("Invalid state data");
   }

   const state = new State();

   if (Array.isArray(data.players)) {
      state.players = data.players.map((playerData: any) => createPlayerFromData(playerData));
   }

   return state;
}

// Deserialize Chat
export function deserializeChat(data: any): Chat {
   if (!data || typeof data !== "object") {
      throw new Error("Invalid chat data");
   }

   const chat = new Chat();

   if (Array.isArray(data.messages)) {
      chat.messages = data.messages.map((msgData: any) => deserializeChatMessage(msgData));
   }

   return chat;
}

// Deserialize ChatMessage
export function deserializeChatMessage(data: any): ChatMessage {
   if (!data || typeof data !== "object") {
      throw new Error("Invalid chat message data");
   }

   return {
      id: data.id || "",
      name: data.name || "",
      message: data.message || "",
   };
}

// Type-safe socket reception wrapper
export class Deserializer {
   // Deserialize received data based on type
   static deserialize(data: any, dataType: string): any {
      try {
         switch (dataType) {
            case "Room":
               return deserializeRoom(data);

            case "Map<string, Player>":
               return deserializePlayerMap(data);

            case "State":
               return deserializeState(data);

            case "Chat":
               return deserializeChat(data);

            case "ChatMessage":
               return deserializeChatMessage(data);

            case "Player":
               return createPlayerFromData(data);

            // Types that don't need deserialization
            case "MoveData":
            case "DamageData":
            case "string":
            case "number":
            case "boolean":
               return data;

            default:
               console.log(`No deserializer for type '${dataType}', returning raw data`);
               return data;
         }
      } catch (error) {
         console.error(`Error deserializing ${dataType}:`, error);
         throw error;
      }
   }

   // Helper for socket.on handlers
   static createHandler<T>(dataType: string, callback: (data: T) => void): (rawData: any) => void {
      return (rawData: any) => {
         try {
            const deserialized = Deserializer.deserialize(rawData, dataType);
            callback(deserialized);
         } catch (error) {
            console.error(`Failed to handle ${dataType}:`, error);
         }
      };
   }
}

// Safe deserialization with validation
export function safeDeserializeRoom(data: any): Room | null {
   try {
      return deserializeRoom(data);
   } catch (error) {
      console.error("Failed to deserialize room:", error);
      return null;
   }
}

export function safeDeserializeState(data: any): State | null {
   try {
      return deserializeState(data);
   } catch (error) {
      console.error("Failed to deserialize state:", error);
      return null;
   }
}

export function safeDeserializeChat(data: any): Chat | null {
   try {
      return deserializeChat(data);
   } catch (error) {
      console.error("Failed to deserialize chat:", error);
      return null;
   }
}

export function safeDeserializePlayerMap(data: any): Map<string, Player> | null {
   try {
      return deserializePlayerMap(data);
   } catch (error) {
      console.error("Failed to deserialize player map:", error);
      return null;
   }
}
