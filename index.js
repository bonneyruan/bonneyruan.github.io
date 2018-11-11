(function() {
        var colors = {
          "#99CCFF": 0.5
        };
        var canvas = new fabric.Canvas('canvas', {
          isDrawingMode: true,
          hoverCursor: "url(spraypaintbottle.png), auto",
          defaultCursor: "url(spraypaintbottle.png), auto"
        })
        .setWidth(window.innerWidth)
        .setHeight(window.innerHeight);

        var colorKeys = Object.keys(colors);
        var color = colorKeys[Math.floor(Math.random() * colorKeys.length)];
        canvas.freeDrawingBrush = new fabric.InkBrush(canvas, {
          width: 70,
          opacity: colors[color],
          color: color
        });
        canvas.isDrawingMode = true;
        if (!("ontouchstart" in document.documentElement)) {
          canvas.on("mouse:move", function(opt) {
            canvas._onMouseDownInDrawingMode(opt.e);
          });
        } else {
          document.querySelector(".canvas-container").style.pointerEvents = "none";
          var x = document.documentElement.clientWidth / 2,
            y = document.documentElement.clientHeight / 2,
            vx = 0, vy = 0,
            ax = 0, ay = 0;

          if (window.DeviceMotionEvent != undefined) {
            window.ondevicemotion = function(e) {
              ax = event.accelerationIncludingGravity.x * 5;
              ay = event.accelerationIncludingGravity.y * 5;
            }

            setInterval(function() {
              var landscapeOrientation = window.innerWidth / window.innerHeight > 1;
              if (landscapeOrientation) {
                vx = vx + ay;
                vy = vy + ax;
              } else {
                vy = vy - ay;
                vx = vx + ax;
              }
              vx = vx * 0.98;
              vy = vy * 0.98;
              y = parseInt(y + vy / 50);
              x = parseInt(x + vx / 50);

              boundingBoxCheck();
              var upperCanvas = document.querySelector(".upper-canvas");
              var syntheticEvent = syntheticMouseEvent(upperCanvas, {
                x: x,
                y: y,
                target: upperCanvas,
                relatedTarget: upperCanvas
              });
              // canvas.isDrawingMode = true;
              canvas._onMouseDownInDrawingMode(syntheticEvent);
            }, 20);
          } 


          function boundingBoxCheck(){
            // bouncy!
            if (x < 0) {
              x = 0; vx = -vx;
            }
            if (y < 0) {
              y = 0; vy = -vy;
            }
            if (x > window.innerWidth) {
              x = window.innerWidth;
              vx = -vx;
            }
            if (y > window.innerHeight) {
              y = window.innerHeight;
              vy = -vy;
            }
          }
        }

        window.addEventListener("resize", () => {
          canvas.setWidth(window.innerWidth);
          canvas.setHeight(window.innerHeight);
        });

        function syntheticMouseEvent(target, options) {
          var event = target.ownerDocument.createEvent('MouseEvent'),
              options = options || {},
              opts = {
                type: "mousemove",
                canBubble: true,
                cancelable: true,
                view: target.ownerDocument.defaultView,
                detail: 1,
                screenX: options.x,
                screenY: options.y,
                clientX: options.x,
                clientY: options.y,
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                metaKey: false,
                button: 0,
                relatedTarget: null,
              };
          for (var key in options) {
            if (options.hasOwnProperty(key)) {
              opts[key] = options[key];
            }
          }
          event.initMouseEvent(
              opts.type,
              opts.canBubble,
              opts.cancelable,
              opts.view,
              opts.detail,
              opts.screenX,
              opts.screenY,
              opts.clientX,
              opts.clientY,
              opts.ctrlKey,
              opts.altKey,
              opts.shiftKey,
              opts.metaKey,
              opts.button,
              opts.relatedTarget
          );
          target.dispatchEvent(event);
          return event;
        }
      })();