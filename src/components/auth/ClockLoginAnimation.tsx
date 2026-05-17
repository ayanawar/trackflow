'use client'

const ticks = Array.from({ length: 12 }, (_, i) => i)

export default function ClockLoginAnimation() {
  return (
    <div className="login-clock-stage" aria-hidden="true">
      <div className="login-clock-orbit login-clock-orbit-outer" />
      <div className="login-clock-orbit login-clock-orbit-inner" />

      <div className="login-clock-face">
        {ticks.map(i => (
          <span
            key={i}
            className="login-clock-tick"
            style={{ transform: `rotate(${i * 30}deg) translateY(-92px)` }}
          />
        ))}

        <div className="login-clock-center" />
        <div className="login-clock-hand login-clock-hour" />
        <div className="login-clock-hand login-clock-minute" />
        <div className="login-clock-hand login-clock-second" />
      </div>

      <div className="login-clock-chip login-clock-chip-a">
        <span>08:42</span>
        <small>focus</small>
      </div>
      <div className="login-clock-chip login-clock-chip-b">
        <span>4.6h</span>
        <small>logged</small>
      </div>
    </div>
  )
}
