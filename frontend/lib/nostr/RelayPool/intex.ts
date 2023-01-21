// import { spawnThread } from 'react-native-multithreading'
import { signEvent, validateEvent, Event } from '../Events'
import RelayPoolModule from '../../Native/WebsocketModule'

export interface RelayFilters {
  ids?: string[]
  authors?: string[]
  kinds?: number[]
  '#e'?: string[]
  '#p'?: string[]
  since?: number
  limit?: number
  until?: number
}

export interface RelayMessage {
  data: string
}

class RelayPool {
  constructor(relaysUrls: string[], privateKey?: string) {
    this.privateKey = privateKey
    this.relays = relaysUrls
    this.subscriptions = {}

    this.relays.forEach((relayUrl) => {
      this.add(relayUrl)
    })
  }

  private readonly privateKey?: string
  private subscriptions: Record<string, string[]>
  public relays: string[]

  private readonly send: (message: object) => void = async (message) => {
    const tosend = JSON.stringify(message)
    RelayPoolModule.send(tosend)
  }

  public readonly connect: (publicKey: string, onEventId: (eventId: string) => void) => void =
    async (publicKey, onEventId) => {
      RelayPoolModule.connect(publicKey, onEventId)
    }

  public readonly add: (relayUrl: string, callback?: () => void) => void = async (
    relayUrl,
    callback = () => {},
  ) => {
    RelayPoolModule.add(relayUrl, callback)
    this.relays.push(relayUrl)
  }

  public readonly remove: (relayUrl: string, callback?: () => void) => void = async (
    relayUrl,
    callback = () => {},
  ) => {
    RelayPoolModule.remove(relayUrl, callback)
    this.relays = this.relays.filter((relay) => relay === relayUrl)
  }

  public readonly sendEvent: (event: Event) => Promise<Event | null> = async (event) => {
    if (this.privateKey) {
      const signedEvent: Event = await signEvent(event, this.privateKey)

      if (validateEvent(signedEvent)) {
        this.send(['EVENT', event])

        return signedEvent
      } else {
        console.log('Not valid event', event)
        return null
      }
    } else {
      return null
    }
  }

  public readonly subscribe: (subId: string, filters?: RelayFilters[]) => void = async (
    subId,
    filters,
  ) => {
    const id = `${subId}${JSON.stringify(filters)}`
    if (this.subscriptions[subId]?.includes(id)) {
      console.log('Subscription already done!', subId)
    } else {
      this.send([...['REQ', subId], ...(filters ?? [])])
      const newSubscriptions = [...(this.subscriptions[subId] ?? []), id]
      this.subscriptions[subId] = newSubscriptions
    }
  }

  public readonly unsubscribe: (subIds: string[]) => void = async (subIds) => {
    subIds.forEach((subId: string) => {
      this.send(['CLOSE', subId])
      delete this.subscriptions[subId]
    })
  }

  public readonly unsubscribeAll: () => void = async () => {
    this.unsubscribe(Object.keys(this.subscriptions))
  }
}

export default RelayPool
