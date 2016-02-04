precision mediump float;
uniform vec2 c;
uniform vec2 scale;

//GLSL implementation of the Escape Time Algorithm (ETA)
// by diederik-dev and mutorials

//escape radius
const float escapeRadius = 4.0;
const int maxIterations = 255;
//mod the iterations to a range of numbers
const float modRange = 64.0;
//adjust range to target normal color scale [0, 1] more
//less different colors if over-adjusted
const float modRangeZoom = 24.0;

void main(void) {
   //scale.x is 1/2 of the viewport size, scale.y is 1/3
   //translate to center, and divide by 1/3
   float Re = (gl_FragCoord.x - scale.x) / scale.y;
   float Im = (gl_FragCoord.y - scale.x) / scale.y;

   float Re2 = Re * Re;
   float Im2 = Im * Im;

   // formula:
   // z^2 + c = z*z + c = (a+bi)*(a+bi) + c = a^2 + 2*abi - b^2 + c
   // Im(z1) = 2*Re(z0)*Im(z0) + Im(c)
   // Re(z1) = Re(z0)^2 - Im(z0)^2 + Re(c)
   for(int n = 0; n < maxIterations; n++) {
     Im = (Re + Re) * Im + c.y;
     Re = Re2 - Im2 + c.x;
     Re2 = Re * Re;
     Im2 = Im * Im;

     // keep iterating till: |z| > r
     if(Re2 + Im2 > escapeRadius){
       //cast int to float
       float a = float(n);

       a = mod(a, modRange) / modRangeZoom;

       // color translation:
       //    a:                             color:
       //    ===================            ===================
       // R: 3.0 ... 2.0 ... 1.0         -> 0.0 ... 1.0 ... 0.0 ... 0.0
       // G:         2.0 ... 1.0 ... 1.0 -> 0.0 ... 0.0 ... 1.0 ... 0.0
       // B: 3.0 2.5 2.0 1.5 1.0 0.5 0.0 -> 1.0 0.5 0.0 0.5 0.0 0.5 1.0
       // A: -                           -> 1.0
       //
       // (3) B   BR  R   RG  G   GB  B (0)
       gl_FragColor = vec4(
         max(0.0, 1.0 - abs(a - 2.0)),
         max(0.0, 1.0 - abs(a - 1.0)),
         max(0.0, abs(a - 1.5) - 0.5),
         1.0);
         //stop iterating
        return;
     }
   }
   //if it does not escape the radius within the set maximum of iterations
   gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);

}
