import "./Checkbox.css";

interface cardProps {
    checkbox_content: string;
    id?: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
}

const Checkbox = ({checkbox_content, id, value, onChange}: cardProps) => {
  return (
    <div className="checkbox-wrapper">
      <input
        type="radio"
        className="check"
        id={id}
        value={value}
        defaultChecked={false}
        name="delivery-option"
        onChange={onChange}
      />
      <label htmlFor={id} className="label">
        <svg width="45" height="45" viewBox="0 0 95 95">
          <rect x="30" y="20" width="50" height="50" stroke="black" fill="none" />
          <g transform="translate(0,-952.36222)">
            <path
              d="m 56,963 c -102,122 6,9 7,9 17,-5 -66,69 -38,52 122,-77 -7,14 18,4 29,-11 45,-43 23,-4"
              stroke="black"
              strokeWidth="3"
              fill="none"
              className="path1"
            />
          </g>
        </svg>
        <span>{checkbox_content}</span>
      </label>
    </div>
  );
};

export default Checkbox;