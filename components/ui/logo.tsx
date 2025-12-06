import Image, { ImageProps } from "next/image";
export default function Logo({ className }: Pick<ImageProps, "className">) {
  return (
    <Image
      src={"/assets/logo.png"}
      alt="logo for Meta Mockup"
      height={100}
      width={140}
      className={className}
    />
  );
}
