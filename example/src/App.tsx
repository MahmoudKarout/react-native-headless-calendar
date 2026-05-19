import '../global.css';
import { ScrollView, Text, View } from 'react-native';
import { SingleDateCalendar } from './components/SingleDateCalendar/SingleDateCalendar';
import { RangeDateCalendar } from './components/RangeDateCalendar/RangeDateCalendar';
import { MultipleDateCalendar } from './components/MultipleDateCalendar/MultipleDateCalendar';
import { SafeAreaListener, SafeAreaView } from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';
const App = () => {
  return (
    <SafeAreaListener
      onChange={({ insets }) => {
        Uniwind?.updateInsets(insets);
      }}
    >
      <ScrollView contentContainerClassName="p-4 pt-safe pb-safe gap-4">
        <SingleDateCalendar />
        <RangeDateCalendar />
        <MultipleDateCalendar />
      </ScrollView>
    </SafeAreaListener>
  );
};

export default App;
