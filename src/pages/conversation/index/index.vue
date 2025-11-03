<template>
  <div class="flex h-full flex-col">
    <!-- <ConversationHeader /> -->
    <ConversationList />

    <div @click="logout" class="logout-btn">退出登录</div>
  </div>
</template>

<script name="conversation" setup lang="ts">
// import ConversationHeader from './components/ConversationHeader.vue'
import ConversationList from './components/ConversationList.vue'
import useUserStore from '@/store/modules/user'

const emit = defineEmits([])

const userStore = useUserStore()
const router = useRouter()

const logout = () => {
  return new Promise((resolve) => {
    userStore.userLogout().finally(() => {
      resolve(true)
      router.push('/login')
    })
  })
}
</script>

<style lang="scss" scoped>
:deep(.van-search) {
  padding-top: 0 !important;
}
.logout-btn {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: #fff;
  text-align: center;
  line-height: 50px;
}
</style>
