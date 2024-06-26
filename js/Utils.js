export class Utils {

    static loadImage = (src) => new Promise(resolve => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.src = src;
    });

    static getPixelMap() {
        return new Uint8Array([
            0, 0, 255,  // blue
            255, 255, 0, // yellow
            255, 0, 0, // red
            0, 255, 0, // green
    
            255, 0, 0,  // red
            0, 255, 0,  // green
            0, 0, 255,  // blue
            255, 255, 0, // yellow
    
            0, 0, 255,  // blue
            255, 255, 0, // yellow
            255, 0, 0,  // red
            0, 255, 0,  // green
    
            255, 0, 0,  // red
            0, 255, 0,  // green
            0, 0, 255,  // blue
            255, 255, 0, // yellow
    
            0, 0, 255,  // blue
            255, 255, 0, // yellow
            255, 0, 0, // red
            0, 255, 0, // green
    
            255, 0, 0,  // red
            0, 255, 0,  // green
            0, 0, 255,  // blue
            255, 255, 0, // yellow
    
            0, 0, 255,  // blue
            255, 255, 0, // yellow
            255, 0, 0,  // red
            0, 255, 0,  // green
    
            255, 0, 0,  // red
            0, 255, 0,  // green
            0, 0, 255,  // blue
            255, 255, 0, // yellow

            0, 0, 255,  // blue
            255, 255, 0, // yellow
            255, 0, 0,  // red
            0, 255, 0,  // green
    
            255, 0, 0,  // red
            0, 255, 0,  // green
            0, 0, 255,  // blue
            255, 255, 0, // yellows
    
            255, 0, 0,  // red
            0, 255, 0,  // green
            0, 0, 255,  // blue
            255, 255, 0, // yellow
    
            0, 0, 255,  // blue
            255, 255, 0, // yellow
            255, 0, 0, // red
            0, 255, 0, // green
    
        ]);
    }
}