<template>
  <div class="states" v-if="IsLobbyPlayer()">
    <v-btn @click="onJoinLobby">Join Lobby</v-btn>
  </div>
  <div class="lobby-state" v-else-if="IsInQueue()">
    <WaitingLobbyPage></WaitingLobbyPage>
    <v-btn class="leave-lobby-btn" @click="exitLobby">Exit Lobby</v-btn>
  </div>
  <div class="states" v-else-if="IsNotReady()">
    <v-btn @click="SigReady">I'm ready to play</v-btn>
  </div>
  <div class="states" v-else-if="OtherNotReady()">
    <h1>ALL SET! Game is about to start...</h1>
  </div>
  <div class="states" v-else-if="IsStarting()">
    <h1>Starting game {{ startingCounter }}</h1>
  </div>
  <div class="overlays" v-else>
    <h1 v-if="IsOpponentDisconnected()"> {{ reconnecting }}</h1>
    <canvas v-else ref="gamecanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, watch } from 'vue'
import { Socket } from 'socket.io-client'
import WaitingLobbyPage from './WaitingLobbyPage.vue'
import { type Rectangle, Paddle, type Circle, Ball, Score } from './pong-types'
import { State } from '@/helpers/state';

const socket: Socket | undefined = inject('socket')
let reconnecting = ref('')
interface Props {
  intraNick?: string
  gameState: State
}
const props = defineProps<Props>()
const emit = defineEmits(['gameOver', 'PlayerWon', 'PlayerLost'])

// State control variables

let startingCounter = ref("...")

// Game related variables
const gamecanvas = ref<HTMLCanvasElement | null>(null)
let ctx = ref<CanvasRenderingContext2D | null>(null)
let ball: Circle | null = null
let paddle1: Rectangle | null = null
let paddle2: Rectangle | null = null
let conv_rate: number | null = null
const board_dims = {
  width: 1400,
  height: 700
}
let score: Score | null = null
let disconnectedId: number | null = null

function IsLobbyPlayer() {
  return props.gameState == State.LOBBY_PLAYER
}

function IsInQueue() {
  return props.gameState == State.IN_LOBBY_QUEUE
}

function IsNotReady() {
  return props.gameState == State.NOT_READY || props.gameState == State.DISCONNECTED
}

function OtherNotReady() {
  return props.gameState == State.WAITING_OTHER_READY
}

function IsStarting() {
  return props.gameState == State.STARTING
}

function IsOpponentDisconnected() {
  return props.gameState == State.OPPONENT_DISCONNECTED
}

onMounted(() => {
  window.addEventListener('resize', onWidthChange)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  if (props.gameState == State.OPPONENT_DISCONNECTED) {
    let ellipsis = ''
    disconnectedId = setInterval(() => {
      reconnecting.value = 'Waiting for other user to reconnect'
      if (ellipsis.length < 3) {
        ellipsis += '.'
      } else {
        ellipsis = ''
      }
      reconnecting.value += ellipsis
    }, 800)
  }
})

onUnmounted(() => {
  socket?.emit('PlayerExited')
  window.removeEventListener('resize', onWidthChange)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})

watch(props, (newValue, oldValue) => {
  if (props.gameState == State.OPPONENT_DISCONNECTED) {
    let ellipsis = ''
    disconnectedId = setInterval(() => {
      reconnecting.value = 'Waiting for other user to reconnect'
      if (ellipsis.length < 3) {
        ellipsis += '.'
      } else {
        ellipsis = ''
      }
      reconnecting.value += ellipsis
    }, 800)
  }
});

socket?.on('updateGame', (game) => {
  if (disconnectedId) {
    clearInterval(disconnectedId)
  }
  if (gamecanvas.value) {
    ctx.value = gamecanvas.value.getContext('2d')
  }
  update_conversion_rate()
  if (ball == null || paddle1 == null || paddle2 == null || score == null || ctx.value == null) {
    init_values(game)
  } else {
    ball.update(game.ball)
    paddle1.update(game.playerPaddle1)
    paddle2.update(game.playerPaddle2)
    score.update(game.score)
  }
  render_animation()
})

socket?.on('PlayerWon', () => {
  emit('PlayerWon')
})

socket?.on('PlayerLost', () => {
  emit('PlayerLost')
})

socket?.on('Starting', (counter: number) => {
  startingCounter.value = counter
})

function init_values(game: any) {
  if (gamecanvas.value != null) {
    ctx.value = gamecanvas.value.getContext('2d')
  }
  if (conv_rate != null) {
    score = new Score(game.score, conv_rate)
    ball = new Ball(game.ball, conv_rate)
    paddle1 = new Paddle(game.playerPaddle1, conv_rate)
    paddle2 = new Paddle(game.playerPaddle2, conv_rate)
  }
}

function update_conversion_rate() {
  if (gamecanvas.value != null) {
    let current_wh_ratio = window.innerWidth / innerHeight
    if (current_wh_ratio > 2) {
      gamecanvas.value.height = window.innerHeight * 0.8
      gamecanvas.value.width = window.innerHeight * 0.8 * 2
    } else {
      gamecanvas.value.height = (window.innerWidth * 0.8) / 2
      gamecanvas.value.width = window.innerWidth * 0.8
    }
    conv_rate = gamecanvas.value.width / board_dims.width
  }
}

function render_animation() {
  if (
    ctx.value != null &&
    ball != null &&
    paddle1 != null &&
    paddle2 != null &&
    gamecanvas.value != null
  ) {
    // printAll()
    resetBoard()
    ball.draw(ctx.value)
    paddle1.draw(ctx.value)
    paddle2.draw(ctx.value)
    score?.draw(ctx.value)
  }
}

function startBoard() {
  if (ctx.value != null && gamecanvas.value != null) {
    ctx.value.fillStyle = 'hsla(155, 40%, 40%, 0.3)'
    ctx.value.fillRect(0, 0, gamecanvas.value.width, gamecanvas.value.height)
  }
}

function clearBoard() {
  if (gamecanvas.value && conv_rate && ctx.value) {
    ctx.value.clearRect(
      0,
      0,
      gamecanvas.value.width * conv_rate,
      gamecanvas.value.height * conv_rate
    )
  }
}

function resetBoard() {
  clearBoard()
  startBoard()
}

function onWidthChange() {
  update_conversion_rate()
  if (conv_rate) {
    ball?.updateConvRate(conv_rate)
    paddle1?.updateConvRate(conv_rate)
    paddle2?.updateConvRate(conv_rate)
    score?.update_dims(conv_rate)
  }
}

function onKeyDown(event: KeyboardEvent) {
  if (paddle1 != null) {
    const handlers: any = {
      ArrowUp: () => {
        socket?.emit('keydown', 'up')
      },
      ArrowDown: () => {
        socket?.emit('keydown', 'down')
      }
    }[event.key]
    handlers?.()
  }
}

function onKeyUp(event: KeyboardEvent) {
  const handlers: any = {
    ArrowUp: () => {
      socket?.emit('keyup', 'up')
    },
    ArrowDown: () => {
      socket?.emit('keyup', 'down')
    }
  }[event.key]
  handlers?.()
}

function onJoinLobby() {
  socket?.emit('AddToLobby', props.intraNick)
}

function exitLobby() {
  socket?.emit('ExitLobby', props.intraNick)
}

function SigReady() {
  socket?.emit('PlayerReady', props.intraNick)
}

</script>

<style>
.states {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 rem;
  margin: 0;
  height: 100%;
  width: 100%;
}

.lobby-state
{
  display: inline-block;
  padding: 0 rem;
  margin: 0;
  height: 100%;
  width: 100%;
}

.overlays {
  padding-top: 5%;
  height: 90%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlays h1 {
  position: absolute;
  z-index: 2;
}

canvas {
  z-index: 1;
}

</style>
