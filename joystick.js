export function createJoystick(root) {
  const knob = root.querySelector(".joystick__knob");
  const state = {
    active: false,
    angle: 0,
    magnitude: 0,
  };

  let activePointerId = null;

  function getCenter() {
    const rect = root.getBoundingClientRect();

    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      radius: rect.width / 2,
    };
  }

  function setKnobOffset(offsetX, offsetY) {
    knob.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
  }

  function updateFromPointer(clientX, clientY) {
    const center = getCenter();
    const dx = clientX - center.x;
    const dy = clientY - center.y;
    const knobRadius = center.radius * 0.36;
    const maxTravel = Math.max(center.radius - knobRadius - 6, 0);
    const distance = Math.hypot(dx, dy);
    const travel = Math.min(distance, maxTravel);
    const ratio = distance > 0 ? travel / distance : 0;
    const offsetX = dx * ratio;
    const offsetY = dy * ratio;

    state.active = true;
    state.angle = Math.atan2(offsetY, offsetX);
    state.magnitude = maxTravel > 0 ? Math.min(distance / maxTravel, 1) : 0;
    setKnobOffset(offsetX, offsetY);
  }

  function resetKnob() {
    activePointerId = null;
    state.active = false;
    state.angle = 0;
    state.magnitude = 0;
    setKnobOffset(0, 0);
  }

  function handlePointerDown(event) {
    activePointerId = event.pointerId;
    root.setPointerCapture(activePointerId);
    updateFromPointer(event.clientX, event.clientY);
    event.preventDefault();
  }

  function handlePointerMove(event) {
    if (activePointerId !== event.pointerId) {
      return;
    }

    updateFromPointer(event.clientX, event.clientY);
    event.preventDefault();
  }

  function handlePointerUp(event) {
    if (activePointerId !== event.pointerId) {
      return;
    }

    resetKnob();
    event.preventDefault();
  }

  root.addEventListener("pointerdown", handlePointerDown);
  root.addEventListener("pointermove", handlePointerMove);
  root.addEventListener("pointerup", handlePointerUp);
  root.addEventListener("pointercancel", handlePointerUp);
  root.addEventListener("lostpointercapture", resetKnob);

  return {
    isActive() {
      return state.active && state.magnitude > 0.05;
    },
    getAngle() {
      return state.angle;
    },
  };
}
