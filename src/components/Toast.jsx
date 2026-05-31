export function Toast({ message }) {
  return message ? <div id="toast" className="toast" role="status">{message}</div> : null;
}
