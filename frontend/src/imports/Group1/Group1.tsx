import imgImage9 from "./51abc5d73fd8553412c5b4eca5bdc92e52bfd167.png";
import imgImage10 from "./850805445e5c052780d48fcc12c385fe4904030d.png";
import imgImage11 from "./ea977575554edf034dd3454704d57ac83fe44cb2.png";

export default function Group() {
  return (
    <div className="relative size-full">
      <div className="absolute h-[845px] left-0 top-0 w-[1727px]" data-name="image 9">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage9} />
      </div>
      <div className="absolute h-[764px] left-0 top-[845px] w-[1727px]" data-name="image 10">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage10} />
      </div>
      <div className="absolute h-[764px] left-0 top-[1609px] w-[1727px]" data-name="image 11">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage11} />
      </div>
    </div>
  );
}