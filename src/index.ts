import { Context, h, Schema } from 'koishi'
import { Speaker, speakers } from './speaker'
import { decoders } from 'audio-decode';
import WavEncoder from 'wav-encoder';

export const name = 'ahsai'

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

class Ahsai {
    constructor(ctx: Context) {
        ctx.command('ahsai <content:text>', '使用 Ahsai 合成语音')
        .option('speaker', '-s [speaker] 设定语音合成器')
        .option('Speed', '-Sp [Speed] 设定语速')
        .option('Pitch', '-P [Pitch] 设定音高')
        .option('Range', '-R [Range] 设定音域')
        .option('Anger', '-A [Anger] 设定愤怒程度')
        .option('Sadness', '-Sa [Sadness] 设定悲伤程度')
        .option('Joy', '-J [Joy] 设定喜悦程度')
        .usage('使用 Ahsai 语音合成器\n可供使用的合成器: ' + Object.keys(speakers).join(', '))
        .example('ahsai -s 琴葉葵 -Sp 1 -P 1 -R 1 -A 0 -Sa 0 -J 1 こんにちは、世界')
        .action(async ({ options }, content) => {
            if (speakers[options.speaker] === undefined) {
                return h.text('找不到该语音合成器')
            }

            const speaker = new Speaker({
                id: 0,
                Volume: 1,
                Speed: options.Speed || 1,
                Pitch: options.Pitch || 1,
                Range: options.Range || 1,
                Anger: options.Anger || 0,
                Sadness: options.Sadness || 0,
                Joy: options.Joy || 0,
            })
            speaker.setSpeaker(options.speaker as any)
            const res = await speaker.speak(ctx, content);

            const data = await ctx.http.get(res, { responseType: 'arraybuffer' })

            return h.audio(await this.processAudio(data), 'audio/wav')
        })
    }

    async processAudio(buffer: ArrayBuffer): Promise<ArrayBuffer> {
        // 转为 AudioBuffer
        const decodedAudio = await decoders.oga(new Uint8Array(buffer))

        // 找到第一次间断位置
        let tmp = new Float32Array(1024)
        let cnt = 0, chunk = 0
        while (cnt < 6) {
            try {
                for (let i = 0; i < 1024; i++) {
                    tmp[i] = (decodedAudio.getChannelData(0)[chunk * 1024 + i] + decodedAudio.getChannelData(1)[chunk * 1024 + i]) / 2
                }
                chunk++
            } catch (e) {
                break;
            }
            if (tmp[0] < 1e-32 && tmp[0] > -1e-32) {
                cnt++
            } else {
                cnt = 0
            }
        }

        // 生成新的 AudioBuffer
        return await WavEncoder.encode({
            sampleRate: decodedAudio.sampleRate,
            channelData: [decodedAudio.getChannelData(0).slice(chunk * 1024), decodedAudio.getChannelData(1).slice(chunk * 1024)],
        })
    }
}

export function apply(ctx: Context) {
    ctx.plugin(Ahsai)
}
