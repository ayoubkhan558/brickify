import { parseValue } from '@lib/cssUtils';

export const transformsMappers = {
  'transform': (val, settings) => {
    settings._transform = settings._transform || {};

    // Extract transform functions
    const transforms = val.match(/(\w+)\(([^)]*)\)/g) || [];

    transforms.forEach(t => {
      const [func, args] = t.split('(');
      const cleanArgs = args.replace(')', '').trim();

      switch (func) {
        case 'translate':
        case 'translateX':
        case 'translateY':
        case 'translateZ':
        case 'translate3d':
          if (func === 'translate') {
            const argsArray = cleanArgs.split(/[,\s]+/).filter(arg => arg.trim() !== '');
            const [x = '0', y = '0'] = argsArray;
            settings._transform.translateX = parseValue(x).toString();
            settings._transform.translateY = parseValue(y).toString();
          } else if (func === 'translateX') {
            settings._transform.translateX = parseValue(cleanArgs).toString();
          } else if (func === 'translateY') {
            settings._transform.translateY = parseValue(cleanArgs).toString();
          } else if (func === 'translateZ') {
            settings._transform.translateZ = parseValue(cleanArgs).toString();
          } else if (func === 'translate3d') {
            const argsArray = cleanArgs.split(/[,\s]+/).filter(arg => arg.trim() !== '');
            const [x = '0', y = '0', z = '0'] = argsArray;
            settings._transform.translateX = parseValue(x).toString();
            settings._transform.translateY = parseValue(y).toString();
            settings._transform.translateZ = parseValue(z).toString();
          }
          break;

        case 'scale':
        case 'scaleX':
        case 'scaleY':
        case 'scaleZ':
        case 'scale3d':
          if (func === 'scale') {
            const argsArray = cleanArgs.split(/[,\s]+/).filter(arg => arg.trim() !== '');
            const [x = '1', y = x] = argsArray;
            settings._transform.scaleX = x.toString();
            settings._transform.scaleY = y.toString();
          } else if (func === 'scaleX') {
            settings._transform.scaleX = cleanArgs.toString();
          } else if (func === 'scaleY') {
            settings._transform.scaleY = cleanArgs.toString();
          } else if (func === 'scaleZ') {
            settings._transform.scaleZ = cleanArgs.toString();
          } else if (func === 'scale3d') {
            const argsArray = cleanArgs.split(/[,\s]+/).filter(arg => arg.trim() !== '');
            const [x = '1', y = '1', z = '1'] = argsArray;
            settings._transform.scale3dX = x.toString();
            settings._transform.scale3dY = y.toString();
            settings._transform.scale3dZ = z.toString();
          }
          break;

        case 'rotate':
        case 'rotateX':
        case 'rotateY':
        case 'rotateZ':
        case 'rotate3d':
          if (func === 'rotate') {
            settings._transform.rotateZ = cleanArgs;
          } else if (func === 'rotateX') {
            settings._transform.rotateX = cleanArgs;
          } else if (func === 'rotateY') {
            settings._transform.rotateY = cleanArgs;
          } else if (func === 'rotateZ') {
            settings._transform.rotateZ = cleanArgs;
          } else if (func === 'rotate3d') {
            const argsArray = cleanArgs.split(/[,\s]+/).filter(arg => arg.trim() !== '');
            const [x = '0', y = '0', z = '0', angle = '0'] = argsArray;
            settings._transform.rotate3dX = x;
            settings._transform.rotate3dY = y;
            settings._transform.rotate3dZ = z;
            settings._transform.rotate3dAngle = angle;
          }
          break;

        case 'skew':
        case 'skewX':
        case 'skewY':
          if (func === 'skew') {
            const argsArray = cleanArgs.split(/[,\s]+/).filter(arg => arg.trim() !== '');
            const [x = '0deg', y = '0deg'] = argsArray;
            settings._transform.skewX = x;
            settings._transform.skewY = y;
          } else if (func === 'skewX') {
            settings._transform.skewX = cleanArgs;
          } else if (func === 'skewY') {
            settings._transform.skewY = cleanArgs;
          }
          break;

        case 'perspective':
          settings._transform.perspective = cleanArgs;
          break;

        case 'matrix':
        case 'matrix3d':
          settings._transform.matrix = t;
          break;
      }
    });

    // Clean up any empty object
    if (Object.keys(settings._transform).length === 0) {
      delete settings._transform;
    }
  },
  'transform-origin': (val, settings) => {
    settings._transformOrigin = val;
  },
  'transform-style': (val, settings) => {
    settings._transformStyle = val;
  },
  'perspective-origin': (val, settings) => {
    settings._perspectiveOrigin = val;
  },
  'backface-visibility': (val, settings) => {
    settings._backfaceVisibility = val;
  }
};
