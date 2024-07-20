import { Context } from 'koishi';

const api = "https://cloud.ai-j.jp/demo/aitalk2webapi_nop.php";

interface SpeakerSettings {
    id: number;
    Volume: number;
    Speed: number;
    Pitch: number;
    Range: number;
    Anger: number;
    Sadness: number;
    Joy: number;
}

const speakers = {
    "琴葉葵": 551,
    "琴葉茜": 552,
    "紲星あかり": 554,
    "吉田くん": 1201,
    "東北ずん子": 1202,
    "月読アイ": 1203,
    "月読ショウタ": 1204,
    "民安ともえ": 1205,
    "結月ゆかり": 1206,
    "水奈瀬コウ": 1207,
    "京町セイカ": 1208,
    "東北きりたん": 1209,
    "桜乃そら": 1210,
    "東北イタコ": 1211,
    "ついなちゃん標準語": 1212,
    "ついなちゃん関西弁": 1213,
    "伊織弓鶴": 1214,
    "音街ウナ": 2006,
};

type Speakers = keyof typeof speakers;

class Speaker {
    private settings: SpeakerSettings;

    constructor(settings?: SpeakerSettings) {
        this.settings = settings || {
            id: 0,
            Volume: 1,
            Speed: 1,
            Pitch: 1,
            Range: 1,
            Anger: 0,
            Sadness: 0,
            Joy: 0,
        };
    }

    setSpeaker(name: Speakers) {
        this.settings.id = speakers[name];
    }

    async speak(ctx: Context, text: string): Promise<string> {
        if (text.length > 100) {
            throw new Error("Text too long");
        }

        const params = new URLSearchParams({
            callback: 'callback',
            speaker_id: this.settings.id.toString(),
            text: text,
            ext: 'ogg',
            volume: this.settings.Volume.toString(),
            speed: this.settings.Speed.toString(),
            pitch: this.settings.Pitch.toString(),
            range: this.settings.Range.toString(),
            anger: this.settings.Anger.toString(),
            sadness: this.settings.Sadness.toString(),
            joy: this.settings.Joy.toString(),
            _: Date.now().toString(),
        });

        try {
            const response = await ctx.http.get(`${api}?${params.toString()}`, {
                method: 'GET',
            });

            let url = response.replace('callback({"url":"', '').replace('"})', '');
            url = url.replace(/\\\//g, '/');
            return "https:" + url;
        } catch (error) {
            throw new Error("Failed to fetch audio info");
        }
    }
}

export { Speaker, speakers };