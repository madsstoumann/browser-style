export default function uiWheelOfFortune(node) {
  const spin = node.querySelector('button');
  const wheel = node.querySelector('ul');
  let animation;
  let previousEndDegree = 0;

  spin.addEventListener('click', () => {
    if (animation) animation.cancel();
    const normalizeAngle = finalAngle => (360 - finalAngle + 90) % 360;

    const items = wheel.children.length;
    const segment = 360 / items;
    const randomAdditionalDegrees = Math.random() * 360 + 1800;
    const newEndDegree = previousEndDegree + randomAdditionalDegrees;
    const finalAngle = newEndDegree % 360;
    const winner = Math.floor(((normalizeAngle(finalAngle) + (segment / 2)) % 360) / segment);

    animation = wheel.animate([
      { transform: `rotate(${previousEndDegree}deg)` },
      { transform: `rotate(${newEndDegree}deg)` }
    ], {
      duration: 4000,
      direction: 'normal',
      easing: 'cubic-bezier(0.440, -0.205, 0.000, 1.130)',
      fill: 'forwards',
      iterations: 1
    });

    previousEndDegree = newEndDegree;
    // animation.onfinish = () => { /* Show winner */ };
    console.log(wheel.children[winner].textContent);
  });
}