import domready from "domready"
import "./style.css"
import Color from "./Color"
import { canvasRGBA } from "stackblur-canvas"
import randomPalette from "./randomPalette"

const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 0,
    height: 0
};

const shadowOffsetX = 16
const shadowOffsetY = 16
/**
 * @type CanvasRenderingContext2D
 */
let ctx;
let canvas;

/**
 * @type CanvasRenderingContext2D
 */
let tmpCtx;
let tmpCanvas;

const numLayers = 3
const borderFactor = 0.25

class Layer
{
    /**
     * tile data
     * @type {Uint8Array}
     */
    grid = null

    /**
     * width in tiles
     * @type {number}
     */
    width = 0

    /**
     * width in tiles
     * @type {number}
     */
    height = 0

    constructor(w,h, size, fn)
    {
        const grid = new Uint8Array(w * h)
        this.grid = grid;
        this.width = w
        this.height = h
        this.size = size

        let off = 0
        for (let y = 0; y < h ; y++)
        {
            for (let x = 0; x < w ; x++)
            {
                if (fn())
                {
                    grid[off] = 255
                }
                else
                {
                    grid[off] = 0
                }
                off++
            }
        }
    }

    path(ctx)
    {
        const { width, height } = config
        const { grid, width : w, height : h, size } = this

        const cx = width >> 1 
        const cy = height >> 1

        const ox = cx - w * size / 2
        const oy = cy - h * size / 2

        const line = w;

        const border = Math.round(size * borderFactor)

        //console.log("BORDER", border)

        let off = 0
        for (let y = 0; y < h ; y++)
        {
            for (let x = 0; x < w ; x++)
            {
                const isArc0 = (y > 0 && !grid[off - line]) && (x > 0 && !grid[off - 1])
                const isArc1 = (y > 0 && !grid[off - line]) && (x < w && !grid[off + 1])
                const isArc2 = (y < h && !grid[off + line]) && (x < w && !grid[off + 1])
                const isArc3 = (y < h && !grid[off + line]) && (x > 0 && !grid[off - 1])

                if (grid[off])
                {
                    ctx.moveTo(ox + x * size, oy + y * size)
                    if (isArc1)
                    {
                        ctx.arcTo(ox + x * size + size, oy + y * size, ox + x * size + size, oy + y * size + size, border)
                    }
                    ctx.lineTo(ox + x * size + size, oy + y * size)
                    if (isArc2)
                    {
                        ctx.arcTo(ox + x * size + size, oy + y * size + size, ox + x * size, oy + y * size + size, border)
                    }
                    ctx.lineTo(ox + x * size + size, oy + y * size + size)
                    if (isArc3)
                    {
                        ctx.arcTo(ox + x * size, oy + y * size + size, ox + x * size, oy + y * size, border)
                    }
                    ctx.lineTo(ox + x * size, oy + y * size + size)
                    if (isArc0)
                    {
                        ctx.arcTo(ox + x * size, oy + y * size, ox + x * size + size, oy + y * size , border)
                    }
                    ctx.lineTo(ox + x * size, oy + y * size)
                }
                off++
            }
        }
    }
}


domready(
    () => {

        canvas = document.getElementById("screen");
        ctx = canvas.getContext("2d");


        const paint = () => {

            const palette = randomPalette()

            let width = (window.innerWidth) | 0;
            let height = (window.innerHeight) | 0;

            const gridScale = 0.04 + 0.03 * Math.random()
            const size = Math.round(Math.max(width, height) * gridScale)

            width += size * 2
            height += size * 2

            config.width = width
            config.height = height

            canvas.style.left = Math.round(-size) + "px"
            canvas.style.top = Math.round(-size) + "px"

            tmpCanvas = document.createElement("canvas")
            tmpCanvas.width = width
            tmpCanvas.height = height
            tmpCtx = tmpCanvas.getContext("2d");

            console.log("SIZE", size)

            canvas.width = width;
            canvas.height = height;

            const layers = Array.from({length: numLayers}).map( (n,i) => {

                const s =Math.round(size + i * (size * 0.25))

                return new Layer(
                    Math.ceil(width / s),
                    Math.ceil(height / s),
                    s,
                    () => Math.random() > Math.pow(i / numLayers, 1.8) + 0.4
                )
            })

            ctx.fillStyle = "#000";
            ctx.fillRect(0,0, width, height);

            const black = new Color(0,0,0)
            const curr = new Color(0,0,0)
            for (let i = 0; i < numLayers; i++)
            {

                ctx.fillStyle = gradient

                if (i > 0)
                {
                    tmpCtx.clearRect(0,0,width,height);
                    tmpCtx.save()
                    tmpCtx.fillStyle="rgba(0,0,0,0.5)"
                    tmpCtx.translate(-shadowOffsetX, -shadowOffsetY)
                    tmpCtx.beginPath()
                    layers[i-1].path(tmpCtx)
                    tmpCtx.clip()
                    tmpCtx.translate(shadowOffsetX, shadowOffsetY)
                    tmpCtx.beginPath()
                    layers[i].path(tmpCtx)
                    tmpCtx.fill()
                    canvasRGBA(tmpCanvas, 0, 0, width, height, Math.max(shadowOffsetX, shadowOffsetY) * 2)
                    ctx.drawImage(tmpCanvas, shadowOffsetX, shadowOffsetY)
                    tmpCtx.restore()
                }

                const bright = Math.pow(0.3 + i/numLayers * 0.7, 1.3);

                const gradient = ctx.createLinearGradient(0,0,0,height)
                gradient.addColorStop(0, Color.from(palette[0|Math.random() * palette.length]).mix(black, 1 - bright, curr).toRGBHex() )
                gradient.addColorStop(1, Color.from(palette[0|Math.random() * palette.length]).mix(black, 1 - bright, curr).toRGBHex() )
                ctx.fillStyle = gradient
                ctx.beginPath()
                layers[i].path(ctx)
                ctx.fill()
            }
        }

        paint()

        canvas.addEventListener("click", paint, true)
    }
);
