/////////////////////////////////////////
//////////////
/// https://www.debugcn.com/en/article/55650595.html
// https://bl.ocks.org/cmgiven/547658968d365bcc324f3e62e175709b
// http://bl.ocks.org/natebates/273b99ddf86e2e2e58ff
//////////////


/**
 *
 * Rectangle collision force.
 *  nodes must have {x, y, width, height} properties
 * NB: {x,y} is the center of the rectangle!
 *
 * Based on: https://observablehq.com/@roblallier/rectangle-collision-force
 *   see also: http://bl.ocks.org/natebates/273b99ddf86e2e2e58ff
 *    quad tree visual explanation: https://jimkang.com/quadtreevis/
 * @export
 * @param {(node: any) => boolean} [nodesFilter=() => true]
 * @returns
 */
export function rectForceCollide(collidePadding = 10) {
  let nodes;

  function force(alpha) {
    const quad = d3.quadtree(
      nodes,
      (d) => d.x,
      (d) => d.y
    );
    // for (const d of nodes) {
    nodes.forEach((d, idx) => {
      quad.visit((_q, x1, y1, x2, y2) => {
        let updated = false;
        if (_q.length) return updated; // internal node (not leaf)

        const q = _q;

        if (q.data && q.data !== d) {
          let x = d.x - q.data.x;
          let y = d.y - q.data.y;
          const xSpacing = collidePadding + (q.data.width + d.width) / 2;
          const ySpacing = collidePadding + (q.data.height + d.height) / 2;
          const absX = Math.abs(x);
          const absY = Math.abs(y);
          let l, lx, ly;

          if (absX < xSpacing && absY < ySpacing) {
            l = Math.sqrt(x * x + y * y);

            lx = (absX - xSpacing) / l;
            ly = (absY - ySpacing) / l;

            // the one that's barely within the bounds probably triggered the collision
            if (Math.abs(lx) > Math.abs(ly)) {
              lx = 0;
            } else {
              ly = 0;
            }
            d.x -= x *= lx;
            d.y -= y *= ly;
            q.data.x += x;
            q.data.y += y;

            updated = true;
          }
        }
        return updated;
      });
    });
  }

  force.initialize = (_nodes) => (nodes = _nodes);

  return force;
}
