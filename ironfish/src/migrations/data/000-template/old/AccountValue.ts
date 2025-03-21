/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { PUBLIC_ADDRESS_LENGTH } from '@ironfish/rust-nodejs'
import bufio from 'bufio'
import { IDatabaseEncoding } from '../../../../storage'

/* This file must define the value schema and database encoding for the old copy
 * of the schema migration, this is the schema of the data in the DB at the time
 * the migration is run.
 *
 * Even if the migration does not modify a store, if you read or write from a
 * store, you will need to have a copy of the schema (ex. AccountValue)
 * and IDatabaseEncoding (ex. AccountValueEncoding) here.
 *
 * The example below is taken from Migration022, which added the viewKey field
 * to the AccountValue schema. */

const KEY_LENGTH = 32
const VERSION_LENGTH = 2

export interface AccountValue {
  version: number
  id: string
  name: string
  spendingKey: string
  incomingViewKey: string
  outgoingViewKey: string
  publicAddress: string
}

export class AccountValueEncoding implements IDatabaseEncoding<AccountValue> {
  serialize(value: AccountValue): Buffer {
    const bw = bufio.write(this.getSize(value))
    bw.writeU16(value.version)
    bw.writeVarString(value.id, 'utf8')
    bw.writeVarString(value.name, 'utf8')
    bw.writeBytes(Buffer.from(value.spendingKey, 'hex'))
    bw.writeBytes(Buffer.from(value.incomingViewKey, 'hex'))
    bw.writeBytes(Buffer.from(value.outgoingViewKey, 'hex'))
    bw.writeBytes(Buffer.from(value.publicAddress, 'hex'))

    return bw.render()
  }

  deserialize(buffer: Buffer): AccountValue {
    const reader = bufio.read(buffer, true)
    const version = reader.readU16()
    const id = reader.readVarString('utf8')
    const name = reader.readVarString('utf8')
    const spendingKey = reader.readBytes(KEY_LENGTH).toString('hex')
    const incomingViewKey = reader.readBytes(KEY_LENGTH).toString('hex')
    const outgoingViewKey = reader.readBytes(KEY_LENGTH).toString('hex')
    const publicAddress = reader.readBytes(PUBLIC_ADDRESS_LENGTH).toString('hex')

    return {
      version,
      id,
      name,
      spendingKey,
      incomingViewKey,
      outgoingViewKey,
      publicAddress,
    }
  }

  getSize(value: AccountValue): number {
    let size = 0
    size += VERSION_LENGTH
    size += bufio.sizeVarString(value.id, 'utf8')
    size += bufio.sizeVarString(value.name, 'utf8')
    size += KEY_LENGTH
    size += KEY_LENGTH
    size += KEY_LENGTH
    size += PUBLIC_ADDRESS_LENGTH

    return size
  }
}
