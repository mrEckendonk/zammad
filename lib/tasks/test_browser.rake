$LOAD_PATH << './lib'
require 'rubygems'

namespace :test do
  desc 'Start browser tests'
  task :browser, [:opts] => :environment do |_t, args|

    start = Time.now()
    if !args.opts
      args.opts = ''
    end
    Dir.glob('test/browser/*_test.rb').sort.each { |r|
      sh "#{args.opts} ruby -Itest #{r}" do |ok, res|
        fail 'Failed test. ' + res.inspect if !ok
      end
    }
    puts 'All browser tests, elapsed: ' + (Time.now() - start).to_s + ' seconds'

  end
end
