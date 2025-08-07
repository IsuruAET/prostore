import Image from "next/image";
import loader from "@/assets/loader.gif";

const LoadingPage = () => {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Image
        src={loader}
        alt="Loading..."
        width={150}
        height={150}
        unoptimized
      />
    </div>
  );
};

export default LoadingPage;
