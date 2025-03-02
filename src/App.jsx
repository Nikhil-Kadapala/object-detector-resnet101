import ImageContainer from "./components/ImageContainer";

const App = () => {
  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-t from-slate-900 to-slate-700 tracking-tighter text-gray-300 antialiased">
      <h1 className="text-4xl font-semibold text-center py-8 ">
        Object Detection using ResNet-101 Model
      </h1>
      <ImageContainer />
    </main>
  );
};

export default App;
