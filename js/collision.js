/**
 * HOWELL CATCH & WIN - Collision Detection Module
 * Handles accurate AABB and totebag opening zone intersection.
 */

export class CollisionSystem {
  /**
   * Checks collision between a falling item and the Howell totebag opening.
   * An item is caught when its lower portion enters the bag opening zone.
   * 
   * @param {Object} item - Falling Item instance
   * @param {Object} bagZone - { x, y, width, height, centerX, openingY }
   * @returns {boolean}
   */
  static checkCatch(item, bagZone) {
    if (item.caught || item.isDead) return false;

    const itemBox = item.getHitbox();

    // Horizontal overlap between item center/hitbox and bag opening
    const itemLeft = itemBox.x;
    const itemRight = itemBox.x + itemBox.width;
    const bagLeft = bagZone.x;
    const bagRight = bagZone.x + bagZone.width;

    const horizontalOverlap = (itemRight > bagLeft && itemLeft < bagRight);

    // Vertical trigger: item's lower edge reaches the bag opening rim
    // Generous threshold to prevent high-speed tunneling on 60fps/120fps displays
    const itemBottom = itemBox.bottomY;
    const verticalOverlap = (
      itemBottom >= bagZone.y &&
      itemBox.y <= bagZone.y + bagZone.height + 40
    );

    return horizontalOverlap && verticalOverlap;
  }

  /**
   * Standard AABB check for generic box overlaps.
   */
  static checkAABB(rectA, rectB) {
    return (
      rectA.x < rectB.x + rectB.width &&
      rectA.x + rectA.width > rectB.x &&
      rectA.y < rectB.y + rectB.height &&
      rectA.y + rectA.height > rectB.y
    );
  }
}
