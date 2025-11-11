import { MessageReceiveOptType } from '@openim/wasm-client-sdk'

export enum UsedFor {
  Register = 1,
  Modify = 2,
  Login = 3,
}

export enum CodeType {
  REGISTRATION = 'REGISTRATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

export type SendSmsParams = {
  mobileNumber: string
  codeType: CodeType
}

export type DemoRegisterParams = {
  mobileNumber: string
  verificationCode: string
  nickname: string
  password: string
  invitationCode?: string
  deviceID?: string
  autoLogin?: boolean
}

export type VerifyCodeParams = {
  phoneNumber?: string
  email?: string
  areaCode: string
  verifyCode: string
  usedFor: UsedFor
}

export type ModifyPasswordParams = {
  mobileNumber: string
  verificationCode: string
  newPassword: string
}

export type ChangPasswordParams = {
  userID: string
  currentPassword: string
  newPassword: string
}

export type DemoLoginParams = {
  mobileNumber?: string
  phoneNumber?: string
  areaCode?: string
  password: string
  email?: string
  verifyCode?: string
}

export interface BusinessUserInfo {
  userID: string
  password: string
  account: string
  phoneNumber: string
  areaCode: string
  email: string
  nickname: string
  faceURL: string
  gender: number
  level: number
  birth: number
  allowAddFriend: BusinessAllowType
  allowBeep: BusinessAllowType
  allowVibration: BusinessAllowType
  globalRecvMsgOpt: MessageReceiveOptType
}

export enum BusinessAllowType {
  Allow = 1,
  NotAllow = 2,
}
