<template>
  <div class="page_container relative px-10">
    <img class="mt-[5vh] h-6 w-6" :src="login_back" alt="" @click="$router.back" />

    <div class="mt-8 text-2xl font-semibold text-primary">注册信息</div>

    <div class="mt-8">
      <div class="mb-1 text-sm text-sub-text">用户昵称</div>
      <div class="rounded-lg border border-gap-text">
        <van-field
          class="!py-1"
          clearable
          v-model="baseInfo.nickname"
          name="nickname"
          type="text"
          placeholder="请输入用户昵称"
        >
        </van-field>
      </div>
    </div>

    <div class="mt-4">
      <div class="mb-1 text-sm text-sub-text">手机号码</div>
      <div class="rounded-lg border border-gap-text">
        <van-field
          class="!py-1"
          clearable
          v-model="baseInfo.phoneNumber"
          name="phoneNumber"
          type="text"
          placeholder="请输入手机号码"
        >
        </van-field>
      </div>
    </div>

    <div class="mt-4">
        <div class="mb-1 text-sm text-sub-text">{{ $t('reAcquireDesc') }}</div>
        <div class="rounded-lg border border-gap-text">
          <van-field
            class="!py-1"
            clearable
            v-model="baseInfo.verificationCode"
            name="verificationCode"
            type="text"
            :placeholder="$t('placeholder.inputVerificationCode')"
          >
            <template #button>
              <span class="text-primary" @click="reSend" v-if="count <= 0">{{
                $t('buttons.verificationCode')
              }}</span>
              <span class="text-primary" v-else>{{ count }}S</span>
            </template>
          </van-field>
        </div>
      </div>

    <div class="mt-4">
      <div class="mb-1 text-sm text-sub-text">{{ $t('password') }}</div>
      <div class="rounded-lg border border-gap-text">
        <van-field
          class="!py-1"
          clearable
          v-model="baseInfo.password"
          name="password"
          type="password"
          :placeholder="$t('placeholder.inputPassword')"
        >
        </van-field>
      </div>
      <div class="mt-0.5 text-xs text-sub-text">{{ $t('passwordRequired') }}</div>
    </div>

    <div class="mt-4">
      <div class="mb-1 text-sm text-sub-text">{{ $t('confirmPassword') }}</div>
      <div class="rounded-lg border border-gap-text">
        <van-field
          class="!py-1"
          clearable
          v-model="baseInfo.confirmPassword"
          name="confirmPassword"
          type="password"
          :placeholder="$t('reConfirmPassword')"
        >
        </van-field>
      </div>
    </div>

    <div class="mt-8">
      <van-button
        block
        type="primary"
        native-type="submit"
        :loading="loading"
        @click="login"
      >
        {{ $t('nowRegister') }}
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import md5 from 'md5'
import login_back from '@assets/images/login_back.png'
import { register } from '@/api/login'
import { setIMProfile } from '@/utils/storage'
import { feedbackToast } from '@/utils/common'
import { BaseData } from '../verifyCode/index.vue'
import { sendSms } from '@/api/login'
import { CodeType } from '@/api/data'

const props = defineProps<{
  baseData: BaseData & { verificationCode: string }
}>()
const router = useRouter()
const { t } = useI18n()

const passwordRegExp = /^(?=.*[0-9])(?=.*[a-zA-Z]).{6,20}$/
const loading = ref(false)
const baseInfo = reactive({
  faceURL: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  phoneNumber: '',
  verificationCode: '',
  birth: 0,
})

const count = ref(0)
let timer: NodeJS.Timer

const startTimer = () => {
  if (timer) {
    clearInterval(timer)
  }
  count.value = 60
  timer = setInterval(() => {
    if (count.value > 0) {
      count.value -= 1
    } else {
      clearInterval(timer)
    }
  }, 1000)
}

const reSend = () => {
  if (count.value > 0) return
  if(!baseInfo.phoneNumber) {
    feedbackToast({
      message: t('messageTip.correctPhoneNumber'),
      error: t('messageTip.correctPhoneNumber'),
    })
    return
  }
  sendSms({mobileNumber: baseInfo.phoneNumber, codeType: CodeType.REGISTRATION}).
  then(startTimer).
  catch(error => {
    console.log('reSend error:', error)
  })
}

const login = async () => {
  if(!baseInfo.phoneNumber) {
    feedbackToast({
      message: t('messageTip.correctPhoneNumber'),
      error: t('messageTip.correctPhoneNumber'),
    })
    return
  }
  if(!baseInfo.verificationCode) {
    feedbackToast({message: "请输入验证码", error: "请输入验证码"})
    return
  }
  if(!baseInfo.nickname) {
    feedbackToast({
      message: "请输入用户昵称",
      error: t('请输入用户昵称'),
    })
    return
  }
  if (!passwordRegExp.test(baseInfo.password)) {
    feedbackToast({
      message: t('messageTip.correctPassword'),
      error: t('messageTip.correctPassword'),
    })
    return
  }
  if (baseInfo.password !== baseInfo.confirmPassword) {
    feedbackToast({
      message: t('messageTip.rePassword'),
      error: t('messageTip.rePassword'),
    })
    return
  }
  localStorage.setItem('IMAccount', baseInfo.phoneNumber)
  loading.value = true
  try {
    const {
      data: { userID },
    } = await register({
      mobileNumber: baseInfo.phoneNumber,
      verificationCode: baseInfo.verificationCode,
      nickname: baseInfo.nickname,
      password: baseInfo.password,
    })
    setIMProfile({ userID })
    router.push('login')
  } catch (error) {
    loading.value = false
    console.log(error)
  }
}
</script>

<style lang="scss" scoped>
.page_container {
  background: linear-gradient(
    180deg,
    rgba(0, 137, 255, 0.1) 0%,
    rgba(255, 255, 255, 0) 100%
  );
}
</style>
